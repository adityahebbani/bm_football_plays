import argparse
import pandas as pd
from inference_sdk import InferenceHTTPClient


def get_class_counts_and_positions(json_data):
    class_counts = {}
    positions = []

    for item in json_data:
        predictions = item.get("predictions", {}).get("predictions", [])
        for pred in predictions:
            class_name = pred["class"]
            x, y = pred["x"], pred["y"]

            class_counts[class_name] = class_counts.get(class_name, 0) + 1
            positions.append({"class": class_name, "x": x, "y": y})

    return class_counts, positions


def main(image_path):
    client = InferenceHTTPClient(
        api_url="https://detect.roboflow.com",
        api_key="hB8S8n5OlohSOI3c51ic"
    )

    result = client.run_workflow(
        workspace_name="boilermake-2025",
        workflow_id="custom-workflow-3",
        images={"image": image_path},
        use_cache=True  # Cache workflow definition for 15 minutes
    )

    class_counts, positions = get_class_counts_and_positions(result)
    df = pd.DataFrame(positions)

    print("Class Counts:", class_counts)
    print(df)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run inference on an image and display results.")
    parser.add_argument("image", help="Path to the input image.")
    args = parser.parse_args()

    main(args.image)
