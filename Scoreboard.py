import argparse
import json
import re
from PIL import Image, ImageDraw, ImageOps
import pytesseract
from inference_sdk import InferenceHTTPClient


def clean_ocr_text(text, class_name):
    """Enhanced text cleaning with football-specific patterns"""
    text = re.sub(r'[^\w\s&:-]', '', text.strip())
    text = re.sub(r'\s+', ' ', text)

    # Common substitutions for all classes
    text = text.replace('O', '0').replace('o', '0').replace('I', '1').replace('l', '1')

    if class_name == "Down":
        # Handle common OCR errors in down format
        text = re.sub(r'(?i)\b([1-4])(st|nd|rd|th)\b', lambda m: m.group().lower(), text)
        text = re.sub(r'(?i)(?:a|8|&apos;|\.)', ' & ', text)
        text = re.sub(r'\s+', ' ', text).strip().title()
        text = re.sub(r'\b(&)\b', 'and', text)

    elif class_name == "Quarter":
        text = re.sub(r'(?i)\b(ond|nrd|qtr|q)\b', '2nd', text)
        text = re.sub(r'(?i)\b([1-4])(st|nd|rd|th)?\b', lambda m: f"{m.group(1)}{m.group(2) or 'th'} Quarter", text)

    elif class_name == "YardNumber":
        # Handle upside-down numbers and combine digits
        text = re.sub(r'\D', '', text)
        inv_map = str.maketrans('6982435710', '9682345710')
        text = text.translate(inv_map)
        if len(text) >= 2:
            return text[-2:]  # Take last two valid digits
        return text.zfill(2) if text else ''

    elif class_name == "Score":
        # Combine adjacent digits
        text = re.sub(r'\D', '', text)
        if len(text) % 2 == 0:
            return text
        return text[:-1] if len(text) > 1 else text  # Handle odd digits

    elif class_name == "PlayTime":
        text = re.sub(r'[^\d:]', '', text)
        if len(text) == 1 and text.isdigit():
            text = f"0{text}"

    return text.strip()


def process_scoreboard(image_path, json_data):
    # Load image and parse JSON
    image = Image.open(image_path)
    data = json.loads(json_data)[0]["model_predictions"]

    # Get original image dimensions
    img_width = data["image"]["width"]
    img_height = data["image"]["height"]
    # scale_factor = 2878 / img_width  # Adjust if image size changes

    results = {}

    for detection in data["predictions"]:
        class_name = detection["class"]
        if class_name == "SB":
            continue

        # Scale coordinates
        w = detection["width"]
        h = detection["height"]
        x = detection["x"]
        y = detection["y"]

        # Calculate bounds
        left = max(0, x - w / 2)
        top = max(0, y - h / 2)
        right = min(image.width, x + w / 2)
        bottom = min(image.height, y + h / 2)

        # Crop and process
        cropped = image.crop((left, top, right, bottom))

        # Enhanced preprocessing
        cropped = cropped.convert('L').resize((cropped.width * 2, cropped.height * 2))
        cropped = ImageOps.autocontrast(cropped)

        # Class-specific OCR configuration
        if class_name in ["Score", "YardNumber"]:
            config = '--psm 7 --oem 3 -c tessedit_char_whitelist=0123456789'
        else:
            config = '--psm 7 --oem 3'

        raw_text = pytesseract.image_to_string(cropped, config=config)

        # Handle upside-down YardNumbers
        if class_name == "YardNumber" and not any(c.isdigit() for c in raw_text):
            raw_text += pytesseract.image_to_string(cropped.rotate(180), config=config)

        cleaned = clean_ocr_text(raw_text, class_name)

        # Special handling for Score positions
        if class_name == "Score":
            if "Score" not in results:
                results["Score"] = ["0", "0"]
            score_pos = 0 if detection["x"] < img_width / 2 else 1
            results["Score"][score_pos] = cleaned or "0"
        else:
            if class_name not in results:
                results[class_name] = []
            if cleaned:
                results[class_name].append(cleaned)

    # Post-processing and validation
    final = {}
    for cls, values in results.items():
        if cls == "Score":
            final[cls] = f"{values[0]}, {values[1]}"
        else:
            # Remove duplicates while preserving order
            seen = set()
            filtered = []
            for v in values:
                if v not in seen and v != '':
                    seen.add(v)
                    filtered.append(v)
            final[cls] = filtered

    # Final formatting
    print("\nFinal Scoreboard Data:")
    for cls in ["Score", "Quarter", "Down", "YardNumber", "PlayTime", "Clock"]:
        if cls in final:
            values = final[cls]
            if cls == "Score":
                print(f"{cls}: {values}")
            else:
                print(f"{cls}: {', '.join(values)}")


def main(image_path):
    client = InferenceHTTPClient(
        api_url="https://detect.roboflow.com",
        api_key="hB8S8n5OlohSOI3c51ic"
    )

    result = client.run_workflow(
        workspace_name="boilermake-2025",
        workflow_id="custom-workflow-4",
        images={"image": image_path},
        use_cache=True
    )

    process_scoreboard(image_path, json.dumps(result))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run inference on an image and extract scoreboard data.")
    parser.add_argument("image", help="Path to the input image.")
    args = parser.parse_args()
    main(args.image)
