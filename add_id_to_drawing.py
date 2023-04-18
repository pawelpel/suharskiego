import json

# Read the JSON data from the file with explicit encoding
with open("drawings.json", "r", encoding="utf-8") as file:
    data = json.load(file)

# Add the "id" field to each item
for item in data:
    instagram_url = item["instagram"]
    item_id = instagram_url.split("/")[-2]
    item["id"] = item_id

# Write the updated JSON data back to the file with explicit encoding
with open("drawings.json", "w", encoding="utf-8") as file:
    json.dump(data, file, indent=4)
