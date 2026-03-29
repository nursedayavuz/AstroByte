import os
import csv
import PyPDF2
from docx import Document

base_dir = r"c:\Users\Berat\Desktop\yarışma\miro_extracted\miro ındırmelerı"

def read_files():
    for f in os.listdir(base_dir):
        path = os.path.join(base_dir, f)
        if f.endswith('.csv'):
            print(f"--- CSV: {f} ---")
            try:
                with open(path, 'r', encoding='utf-8') as file:
                    reader = csv.reader(file)
                    for i, row in enumerate(reader):
                        if i < 3:
                            print(row)
                        else:
                            break
            except Exception as e:
                print(f"Error: {e}")
                
        elif f.endswith('.pdf'):
            print(f"--- PDF: {f} ---")
            try:
                reader = PyPDF2.PdfReader(path)
                text = reader.pages[0].extract_text()
                print(text[:200].replace('\n', ' '))
            except Exception as e:
                print(f"Error: {e}")
                
        elif f.endswith('.docx'):
            print(f"--- DOCX: {f} ---")
            try:
                doc = Document(path)
                print(" ".join([p.text for p in doc.paragraphs[:5]])[:200])
            except Exception as e:
                print(f"Error: {e}")
                
if __name__ == "__main__":
    try:
        read_files()
    except Exception as e:
        print(f"Fatal Error: {e}")
