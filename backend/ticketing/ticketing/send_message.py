import requests
import json
import os
import time

# Replace with your actual Discord Webhook URL
WEBHOOK_URL = "https://discord.com/api/webhooks/1341964370879578183/SPTXnwJRmKKDQC9n45F1JJnvXwXQffzVjpxeqzZhAaU3u_R9HH3p7HjybuW1uLgq42ta"

# Path to the generated JSON file
json_file_path = "ticketing/fixtures/generated_tickets.json"

# Ensure the file exists and is not empty
if not os.path.exists(json_file_path) or os.stat(json_file_path).st_size == 0:
    print("❌ Error: JSON file not found or is empty.")
    exit()

with open(json_file_path, "r") as file:
    try:
        data = json.load(file)
    except json.JSONDecodeError as e:
        print(f"❌ Error decoding JSON: {e}")
        exit()

# Normalize data: if tickets are stored in fixture format (with "fields"), extract them.
tickets = []
for entry in data:
    if "fields" in entry:
        ticket = entry["fields"]
        ticket["id"] = entry.get("pk", None)
    else:
        ticket = entry
    tickets.append(ticket)

print("✅ JSON loaded and normalized successfully!")

# Discord messages are limited to 2000 characters, so split tickets into batches.
messages = []
current_message = ""

# Process tickets in batches
for ticket in tickets:
    # Use a list comprehension to build a ticket string for each ticket in a batch
    ticket_info = (
        f"🔹 {ticket.get('name', 'N/A')} - {ticket.get('issue', 'N/A')} "
        f"(Priority: {ticket.get('priority', 'N/A')})\n"
    )
    
    # Ensure message does not exceed ~1900 characters to be safe
    if len(current_message) + len(ticket_info) > 1900:
        messages.append(current_message)
        current_message = ""
    
    current_message += ticket_info

if current_message:
    messages.append(current_message)

print(f"Total messages to send: {len(messages)}")

# Send each batch with a delay to avoid rate limits
for i, msg in enumerate(messages):
    payload = {
        "username": "Ticket Bot",
        "content": f"**Batch {i+1}:**\n{msg}"
    }
    response = requests.post(WEBHOOK_URL, json=payload)
    if response.status_code == 204:
        print(f"✅ Batch {i+1}/{len(messages)} sent successfully!")
    else:
        print(f"❌ Failed to send batch {i+1}. Error code: {response.status_code}, Response: {response.text}")
    time.sleep(2)  # Adjust delay as needed

print("✅ All ticket batches sent to Discord!")
