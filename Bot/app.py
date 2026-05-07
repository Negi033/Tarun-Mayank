import streamlit as st
try:
    from langchain_groq import ChatGroq
except ImportError:
    ChatGroq = None
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv
import os
from pypdf import PdfReader

# -------------------- LOAD ENV --------------------
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# -------------------- PAGE CONFIG --------------------
st.set_page_config(
    page_title="AI Resume & Interview Assistant",
    page_icon="🤖",
    layout="wide"
)

# -------------------- SIDEBAR --------------------
st.sidebar.title("📂 Upload Documents")

resume_file = st.sidebar.file_uploader(
    "Upload Resume (PDF)", type=["pdf"]
)

jd_file = st.sidebar.file_uploader(
    "Upload Job Description (PDF or TXT)", type=["pdf", "txt"]
)

st.sidebar.markdown("---")
st.sidebar.info("Built with Groq + LLaMA 3.1")

# -------------------- PDF TEXT EXTRACTION --------------------
def extract_pdf_text(file):
    pdf = PdfReader(file)
    text = ""
    for page in pdf.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text

# -------------------- READ DOCUMENTS --------------------
resume_text = ""
jd_text = ""

if resume_file:
    resume_text = extract_pdf_text(resume_file)

if jd_file:
    if jd_file.type == "application/pdf":
        jd_text = extract_pdf_text(jd_file)
    else:
        jd_text = jd_file.read().decode("utf-8")

# -------------------- INITIALIZE LLM --------------------
llm = None
if ChatGroq is not None:
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name="llama-3.1-8b-instant",
        streaming=True
    )

# -------------------- CHAT MEMORY --------------------
if "messages" not in st.session_state:
    st.session_state.messages = []

# -------------------- MAIN TITLE --------------------
st.title("🤖 AI Resume & Interview Assistant")
st.caption("Upload resume & job description and start chatting.")

# -------------------- DISPLAY OLD MESSAGES --------------------
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# -------------------- CHAT INPUT --------------------
if prompt := st.chat_input("Ask something about your resume or job description..."):

    # Save user message
    st.session_state.messages.append({
        "role": "user",
        "content": prompt
    })

    with st.chat_message("user"):
        st.markdown(prompt)

    # -------------------- SYSTEM CONTEXT --------------------
    system_prompt = f"""
    You are an AI Interview Assistant.

    Resume Content:
    {resume_text}

    Job Description Content:
    {jd_text}

    Your tasks:
    - Analyze skill match
    - Suggest improvements
    - Identify missing skills
    - Generate interview questions
    - Provide career guidance

    Give clear and structured answers.
    """

    # -------------------- STREAMING RESPONSE --------------------
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        full_response = ""

        if llm is None:
            full_response = "The bot service is not available because langchain_groq is not installed. Please install it with pip install -r requirements.txt."
            message_placeholder.markdown(full_response)
        else:
            for chunk in llm.stream([
                SystemMessage(content=system_prompt),
                HumanMessage(content=prompt)
            ]):
                if chunk.content:
                    full_response += chunk.content
                    message_placeholder.markdown(full_response + "▌")

            message_placeholder.markdown(full_response)

    # Save assistant message
    st.session_state.messages.append({
        "role": "assistant",
        "content": full_response
    })


    # conda activate interviewbot