# Django Quick Reference: Essential Commands

## 1. Environment & Project Setup

- **Activate Your Virtual Environment:**
  ```bash
  source ~/.local/share/virtualenvs/wcjc_capstone-SO5ZAU7E/bin/activate
  ```

- **Navigate to the Project Directory:**
  ```bash
  cd ~/Ticket_System/wcjc_capstone/backend/
  ```

## 2. Database Initialization

- **Apply Migrations:**
  ```bash
  python manage.py makemigrations
  python manage.py migrate
  ```

- **(Optional) Create a Superuser:**
  ```bash
  python manage.py createsuperuser
  ```

## 3. Ticket Fixture Operations

- **Generate Ticket Fixture (1,300 Tickets):**
  ```bash
  python ticketing/generate_tickets.py
  ```

- **Verify the Generated File:**
  ```bash
  ls -lh /mnt/data/generated_tickets.json
  ```

- **(Optional) Move Fixture to the Appropriate Directory:**
  ```bash
  mv /mnt/data/generated_tickets.json ~/Ticket_System/wcjc_capstone/backend/ticketing/fixtures/
  ```

- **Load the Fixture into Your Database:**
  ```bash
  python manage.py loaddata ticketing/fixtures/generated_tickets.json
  ```

- **Validate the Import via Django Shell:**
  ```bash
  python manage.py shell
  ```
  Then, within the shell:
  ```python
  from ticketing.models import Ticket
  print(Ticket.objects.count())  # Expected output: 1300
  ```

## 4. Discord Webhook Integration

- **Send Ticket Data to Discord:**
  ```bash
  python ticketing/send_message.py
  ```

*Note: Ensure you have replaced "YOUR_DISCORD_WEBHOOK_URL" in the script with your actual Discord webhook URL.*

## 5. Running the Django Server

- **Run on a Specific Host/Port (e.g., 10.10.10.1:8000):**
  ```bash
  python manage.py runserver 10.10.10.1:8000
  ```

- **For External Access (bind to all interfaces):**
  ```bash
  python manage.py runserver 0.0.0.0:8000
  ```

- **(Optional) Flush the Database Before Reloading Fixtures:**
  ```bash
  python manage.py flush
  ```

## 6. Additional Best Practices & Commands

- **Review `ALLOWED_HOSTS` Configuration in `settings.py`:**
  ```python
  ALLOWED_HOSTS = ["10.10.10.1", "localhost", "127.0.0.1"]
  ```

- **Manage Rate Limits:**  
  The webhook integration script includes a delay (e.g., `time.sleep(2)`) to prevent hitting Discord's rate limits.

- **Debugging & Testing:**  
  Utilize the Django shell (`python manage.py shell`) for real-time database interactions, and consider running:
  ```bash
  python manage.py test
  ```
  to execute your automated tests and ensure code integrity.

---

By adhering to these critical steps and commands, you position your Django application for scalability, enhanced security, and optimal network integration. This agile approach not only streamlines your deployment process but also ensures that every operational facet is aligned with best practices and industry standards.
