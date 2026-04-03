FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY Backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY Backend ./Backend

EXPOSE 8001

CMD ["uvicorn", "Backend.app:app", "--host", "0.0.0.0", "--port", "8001"]