import pdfplumber
import PyPDF2
from typing import Optional
import os

class PDFService:
    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        """
        Extract text from PDF using pdfplumber (better for text extraction)
        Falls back to PyPDF2 if pdfplumber fails
        """
        text = ""
        
        try:
            # Try pdfplumber first (better text extraction)
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
        except Exception as e:
            print(f"pdfplumber failed: {e}, trying PyPDF2...")
            # Fallback to PyPDF2
            try:
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        text += page.extract_text() + "\n\n"
            except Exception as e2:
                print(f"PyPDF2 also failed: {e2}")
                raise Exception(f"Failed to extract text from PDF: {str(e2)}")
        
        if not text.strip():
            raise Exception("No text could be extracted from the PDF")
        
        return text.strip()
    
    @staticmethod
    def save_text_to_file(text: str, output_path: str) -> str:
        """Save extracted text to a file"""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        return output_path

