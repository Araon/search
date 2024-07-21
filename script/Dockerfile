FROM python:3.9-slim

WORKDIR /app

RUN pip3 install pymongo requests python-dotenv

COPY .env .

COPY load_data.py .

CMD ["python", "load_data.py"]
