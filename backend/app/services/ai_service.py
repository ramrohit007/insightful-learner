import os
import json
import re
from typing import List, Dict, Any
from openai import OpenAI
import httpx

class AIService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        if self.openai_api_key:
            self.client = OpenAI(api_key=self.openai_api_key)
    
    def extract_topics_from_syllabus(self, syllabus_text: str) -> List[str]:
        """
        Extract topics from syllabus text using AI or pattern matching
        """
        if self.client:
            return self._extract_with_openai(syllabus_text, "topics")
        else:
            return self._extract_topics_fallback(syllabus_text)
    
    def segment_qa_from_answer_sheet(self, answer_text: str) -> List[Dict[str, str]]:
        """
        Segment answer sheet text into question-answer pairs
        """
        if self.client:
            return self._segment_with_openai(answer_text)
        else:
            return self._segment_qa_fallback(answer_text)
    
    def analyze_topic_understanding(self, topics: List[str], qa_pairs: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Analyze how well each topic is understood based on Q&A pairs
        Returns list of {topic, understanding_score, confidence, details}
        """
        if self.client:
            return self._analyze_with_openai(topics, qa_pairs)
        else:
            return self._analyze_fallback(topics, qa_pairs)
    
    def _extract_with_openai(self, text: str, task: str) -> List[str]:
        """Extract topics using OpenAI"""
        try:
            prompt = f"""Extract all distinct topics/subjects from the following syllabus text. 
Return only a JSON array of topic names, nothing else.

Syllabus text:
{text[:3000]}

Return format: ["topic1", "topic2", "topic3"]"""
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that extracts topics from educational content. Always return valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            result = response.choices[0].message.content.strip()
            # Clean JSON response
            result = re.sub(r'```json\s*', '', result)
            result = re.sub(r'```\s*', '', result)
            topics = json.loads(result)
            return topics if isinstance(topics, list) else []
        except Exception as e:
            print(f"OpenAI extraction failed: {e}, using fallback")
            return self._extract_topics_fallback(text)
    
    def _extract_topics_fallback(self, text: str) -> List[str]:
        """Fallback topic extraction using pattern matching"""
        topics = []
        lines = text.split('\n')
        
        # Look for numbered/bulleted topics
        patterns = [
            r'^\d+[\.\)]\s*(.+)$',
            r'^[-*]\s*(.+)$',
            r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:?\s*$',  # Title case lines
        ]
        
        for line in lines:
            line = line.strip()
            if len(line) < 5 or len(line) > 100:
                continue
            
            for pattern in patterns:
                match = re.match(pattern, line)
                if match:
                    topic = match.group(1) if match.groups() else line
                    topic = topic.strip(':-').strip()
                    if topic and topic not in topics:
                        topics.append(topic)
                        break
        
        # If no topics found, split by common delimiters
        if not topics:
            sections = re.split(r'\n\s*\n', text)
            for section in sections[:20]:  # Limit to first 20 sections
                first_line = section.split('\n')[0].strip()
                if 10 < len(first_line) < 80:
                    topics.append(first_line)
        
        return topics[:15]  # Limit to 15 topics
    
    def _segment_with_openai(self, text: str) -> List[Dict[str, str]]:
        """Segment Q&A using OpenAI"""
        try:
            prompt = f"""Extract all question-answer pairs from the following answer sheet text.
Return a JSON array of objects with "question" and "answer" keys.

Answer sheet text:
{text[:4000]}

Return format: [{{"question": "Q1", "answer": "A1"}}, {{"question": "Q2", "answer": "A2"}}]"""
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that extracts question-answer pairs from exam answer sheets. Always return valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            result = response.choices[0].message.content.strip()
            result = re.sub(r'```json\s*', '', result)
            result = re.sub(r'```\s*', '', result)
            qa_pairs = json.loads(result)
            return qa_pairs if isinstance(qa_pairs, list) else []
        except Exception as e:
            print(f"OpenAI segmentation failed: {e}, using fallback")
            return self._segment_qa_fallback(text)
    
    def _segment_qa_fallback(self, text: str) -> List[Dict[str, str]]:
        """Fallback Q&A segmentation using pattern matching"""
        qa_pairs = []
        
        # Split by common question patterns
        question_patterns = [
            r'(?:^|\n)\s*(?:Q|Question)\s*\d+[\.\):]\s*(.+?)(?=\n\s*(?:Q|Question|Answer|A)\s*\d|$)',
            r'(?:^|\n)\s*\d+[\.\)]\s*(.+?)(?=\n\s*\d+[\.\)]|$)',
        ]
        
        for pattern in question_patterns:
            matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)
            for match in matches:
                question = match.group(1).strip()
                # Find answer (next paragraph or section)
                start_pos = match.end()
                next_match = re.search(r'(?:^|\n)\s*(?:Q|Question|A|Answer)\s*\d', text[start_pos:], re.IGNORECASE)
                end_pos = start_pos + (next_match.start() if next_match else len(text))
                answer = text[start_pos:end_pos].strip()
                
                if question and answer and len(answer) > 10:
                    qa_pairs.append({
                        "question": question[:500],
                        "answer": answer[:2000]
                    })
            
            if qa_pairs:
                break
        
        # If no structured Q&A found, split by paragraphs
        if not qa_pairs:
            paragraphs = [p.strip() for p in text.split('\n\n') if len(p.strip()) > 20]
            for i in range(0, len(paragraphs) - 1, 2):
                qa_pairs.append({
                    "question": paragraphs[i][:500],
                    "answer": paragraphs[i + 1][:2000] if i + 1 < len(paragraphs) else ""
                })
        
        return qa_pairs[:20]  # Limit to 20 Q&A pairs
    
    def _analyze_with_openai(self, topics: List[str], qa_pairs: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Analyze understanding using OpenAI"""
        try:
            qa_text = "\n\n".join([f"Q: {qa['question']}\nA: {qa['answer']}" for qa in qa_pairs[:10]])
            
            prompt = f"""Analyze the student's understanding of each topic based on their answers.
Topics: {', '.join(topics[:10])}

Question-Answer pairs:
{qa_text[:3000]}

For each topic, provide:
- understanding_score (0-100): How well the student understands this topic
- confidence (0-1): How confident you are in this assessment
- details: Brief explanation

Return JSON array: [{{"topic": "topic1", "understanding_score": 85, "confidence": 0.9, "details": "..."}}, ...]"""
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an educational assessment AI. Analyze student understanding and return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            result = response.choices[0].message.content.strip()
            result = re.sub(r'```json\s*', '', result)
            result = re.sub(r'```\s*', '', result)
            analyses = json.loads(result)
            
            if isinstance(analyses, list):
                return analyses
            return []
        except Exception as e:
            print(f"OpenAI analysis failed: {e}, using fallback")
            return self._analyze_fallback(topics, qa_pairs)
    
    def _analyze_fallback(self, topics: List[str], qa_pairs: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Fallback analysis using keyword matching"""
        all_text = " ".join([qa.get("answer", "") + " " + qa.get("question", "") for qa in qa_pairs]).lower()
        
        analyses = []
        for topic in topics:
            topic_lower = topic.lower()
            topic_words = topic_lower.split()
            
            # Count keyword matches
            matches = sum(1 for word in topic_words if word in all_text)
            word_coverage = matches / len(topic_words) if topic_words else 0
            
            # Calculate understanding score (0-100)
            base_score = min(100, word_coverage * 100)
            # Add some randomness for demo purposes
            import random
            score = base_score + random.uniform(-10, 10)
            score = max(0, min(100, score))
            
            analyses.append({
                "topic": topic,
                "understanding_score": round(score, 1),
                "confidence": min(1.0, word_coverage + 0.3),
                "details": f"Found {matches}/{len(topic_words)} topic keywords in answers"
            })
        
        return analyses

