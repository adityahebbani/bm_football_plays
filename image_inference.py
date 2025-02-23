import argparse
import pandas as pd
from inference_sdk import InferenceHTTPClient


def classify_formation(num_qbs, num_rbs, num_tes, num_wrs):
    if num_qbs == 0:
        return "WILDCAT"
    elif num_rbs == 0:
        return "EMPTY"
    elif num_qbs == 1 and num_rbs == 1 and num_tes >= 2 and num_wrs <= 2:
        return "JUMBO"
    elif num_qbs == 1 and num_rbs == 2:
        return "I_FORM"
    elif num_qbs == 1 and num_rbs == 1:
        return "PISTOL" if num_tes >= 1 and num_wrs >= 2 else "SINGLEBACK"
    elif num_qbs == 1 and num_rbs >= 1:
        return "SHOTGUN"
    return "UNKNOWN"


def process_image(image_path):
    client = InferenceHTTPClient(
        api_url="https://detect.roboflow.com",
        api_key="hB8S8n5OlohSOI3c51ic"
    )

    result = client.run_workflow(
        workspace_name="boilermake-2025",
        workflow_id="custom-workflow-3",
        images={"image": image_path},
        use_cache=True
    )

    positions = []
    for item in result:
        for pred in item.get("predictions", {}).get("predictions", []):
            positions.append({"class": pred["class"]})

    df = pd.DataFrame(positions)
    counts = df['class'].value_counts()

    position_counts = {
        'qb': counts.get('qb', 0),
        'running_back': counts.get('running_back', 0),
        'tight_end': counts.get('tight_end', 0),
        'wide_receiver': counts.get('wide_receiver', 0)
    }

    return classify_formation(
        position_counts['qb'],
        position_counts['running_back'],
        position_counts['tight_end'],
        position_counts['wide_receiver']
    )


def main():
    parser = argparse.ArgumentParser(description="Classify football formation from an image.")
    parser.add_argument("image", help="Path to the input image.")
    args = parser.parse_args()

    formation = process_image(args.image)
    print(formation)


if __name__ == "__main__":
    main()