export const evaluateTranscript = async (req , res , data) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({
                error: "Transcript is required",
            });
        }

        const prompt = `
You are an expert technical interviewer.

Evaluate the candidate based on this interview transcript.

Rules:
- Give a score out of 10.
- Be strict but fair.
- Do not overvalue English fluency.
- Focus on technical understanding, clarity, problem-solving, confidence, and relevance.
- If the answer is incomplete, mention it.
- Return the result in clean JSON only.

JSON format:
{
  "score": number,
  "summary": "short overall evaluation",
  "strengths": ["point 1", "point 2"],
  "weaknesses": ["point 1", "point 2"],
  "improvementAdvice": "specific advice for the candidate"
}

Interview transcript:
${transcript}
`;

        const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gemma3:4b",
                prompt,
                stream: false,
            }),
        });

        const data = await ollamaResponse.json();

        res.json({
            success: true,
            raw: data.response,
        });
    } catch (error) {
        console.error("Local LLM evaluation error:", error);

        res.status(500).json({
            error: "Failed to evaluate transcript with local LLM",
        });
    }
};

export const evaluationChecker = async (req , res) => {
    const evaluation = completedEvaluations.get(req.params.sessionId);

  if (!evaluation) {
    res.status(404).json({ error: "Evaluation is not ready yet." });
    return;
  }

  res.json(evaluation);
}