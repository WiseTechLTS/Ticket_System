import os
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime

# Example list of ticket data you want to overlay onto the workorder form.
# Replace with real data pulled from your database or script.
tickets_data = [
    {
        "ticket_number": 1001,
        "department": "Medical",
        "sub_department": "PEDIATRICS",
        "priority": "Level 1 (Lowest)",
        "assigned_to": "Helpdesk",
        "issue_description": (
            "PEDIATRICS encountered intermittent scheduling errors "
            "during patient intake, leading to minor delays."
        ),
        "work_performed": "Technician updated scheduling software configuration."
    },
    {
        "ticket_number": 1002,
        "department": "Medical",
        "sub_department": "INTENSIVE CARE UNIT (ICU)",
        "priority": "Level 3 (Highest)",
        "assigned_to": "Helpdesk",
        "issue_description": (
            "ICU reported a system-wide failure affecting patient monitoring devices "
            "and alert systems. Urgent intervention required."
        ),
        "work_performed": "Investigated network logs; replaced faulty router."
    },
    # ... Add more tickets as needed
]

def generate_it_work_forms(tickets, template_path, output_dir):
    """
    Generates an IT work form image for each ticket, overlaying the data onto the template.
    
    :param tickets: List of ticket dictionaries.
    :param template_path: File path to the blank workorder image.
    :param output_dir: Directory where generated forms will be saved.
    """

    # Create the output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Load a TrueType or OpenType font for text rendering
    # Adjust the font size to match your form's spacing
    font = ImageFont.truetype("arial.ttf", 18)

    # Coordinates are placeholders; adjust as needed
    coord_department = (100, 150)       # (x, y) for "Department"
    coord_number = (400, 150)          # (x, y) for "Number"
    coord_date = (600, 150)            # (x, y) for "Date"
    coord_sub_department = (100, 210)  # (x, y) for "Sub Department"
    coord_priority = (400, 210)        # (x, y) for "Priority"
    coord_assigned = (100, 270)        # (x, y) for "Assigned To"
    coord_issue = (100, 350)           # (x, y) for "Issue Description"
    coord_work_performed = (100, 600)  # (x, y) for "Work Performed"

    for ticket in tickets:
        # Open the template image
        with Image.open(template_path).convert("RGB") as base:
            draw = ImageDraw.Draw(base)

            # Format date
            current_date = datetime.now().strftime("%m/%d/%Y")

            # Draw each field. Adjust text wrap or line spacing as needed.
            draw.text(coord_department, f"Department: {ticket['department']}", fill="black", font=font)
            draw.text(coord_number, f"Number: {ticket['ticket_number']}", fill="black", font=font)
            draw.text(coord_date, f"Date: {current_date}", fill="black", font=font)
            draw.text(coord_sub_department, f"Sub Dept: {ticket['sub_department']}", fill="black", font=font)
            draw.text(coord_priority, f"Priority: {ticket['priority']}", fill="black", font=font)
            draw.text(coord_assigned, f"Assigned To: {ticket['assigned_to']}", fill="black", font=font)

            # Issue description - possibly multi-line text
            draw.text(coord_issue, f"Issue: {ticket['issue_description']}", fill="black", font=font)
            
            # Work performed
            draw.text(coord_work_performed, f"Work Performed: {ticket['work_performed']}", fill="black", font=font)

            # Save the modified image under a new file name
            output_path = os.path.join(output_dir, f"workorder_ticket_{ticket['ticket_number']}.png")
            base.save(output_path, "PNG")
            print(f"Generated work form: {output_path}")

if __name__ == "__main__":
    # Define where your blank form is located and where output will go
    template_image_path = "./templates/workorder.png"
    output_folder = "./generated_forms"

    # Generate forms
    generate_it_work_forms(tickets_data, template_image_path, output_folder)
