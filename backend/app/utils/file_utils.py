import os
import fitz  # PyMuPDF para PDF
import docx

def extract_text_from_file(file_path: str) -> str:
    """
    Extrae texto de archivos PDF, TXT y DOCX.
    """
    file_extension = file_path.split(".")[-1].lower()
    
    if file_extension == "txt":
        return extract_text_from_txt(file_path)
    elif file_extension == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_extension == "docx":
        return extract_text_from_docx(file_path)
    else:
        raise ValueError("Formato de archivo no soportado para extracción de texto")


def extract_text_from_txt(file_path: str) -> str:
    """Extrae texto de archivos TXT."""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def extract_text_from_pdf(file_path: str) -> str:
    """Extrae texto de archivos PDF usando PyMuPDF."""
    doc = fitz.open(file_path)
    text = "\n".join([page.get_text("text") for page in doc])
    return text


def extract_text_from_docx(file_path: str) -> str:
    """Extrae texto de archivos DOCX usando python-docx."""
    doc = docx.Document(file_path)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text
