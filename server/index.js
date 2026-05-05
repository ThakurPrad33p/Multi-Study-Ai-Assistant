const express = require("express")
const cors = require("cors")
const axios = require("axios")

const app = express()
app.use(cors())
app.use(express.json())

const AUTH_TOKEN = process.env.AUTH_TOKEN

async function callAI(prompt) {
    const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        },
        {
            headers: {
                Authorization: `Bearer ${AUTH_TOKEN}`,
                "Content-Type": "application/json"
            }
        }
    )

    return res.data.choices[0].message.content
}

app.post("/process", async (req, res) => {
    try {
        const { text } = req.body

        const explanation = await callAI(`
You are an expert teacher.

Explain the following content in a simple and clear way for a Class 10-12 student.

Rules:
- Use simple language
- Break into short points
- Use examples if possible
- Keep it structured

Content:
${text}
`)

        const quiz = await callAI(`
Generate 5 MCQs in STRICT JSON format.

Rules:
- Each question must have 4 options
- DO NOT use labels like A, B, C, D inside options
- Randomize correct answers (not always first)
- Return ONLY JSON

Format:
[
  {
    "question": "....",
    "options": ["option1", "option2", "option3", "option4"],
    "answer": "exact correct option text"
  }
]

Content:
${text}
`)

        let quizData

        try {
            quizData = JSON.parse(quiz)
        } catch {
            quizData = []
        }

        res.json({ explanation, quiz: quizData })

    } catch (err) {
        console.log(err.response?.data || err.message)
        res.status(500).json({ error: "failed" })
    }
})

app.listen(5000, () => console.log("Server running"))
