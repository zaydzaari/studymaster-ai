export async function exportToPDF(result) {
  const { default: html2pdf } = await import("html2pdf.js");

  const difficultyColor = {
    easy: "#065F46",
    medium: "#78350F",
    hard: "#7F1D1D",
  };
  const difficultyBg = {
    easy: "#D1FAE5",
    medium: "#FEF3C7",
    hard: "#FEE2E2",
  };

  const el = document.createElement("div");
  el.style.cssText = "font-family: system-ui, sans-serif; padding: 20px; color: #18181B;";
  el.innerHTML = `
    <div style="text-align:center; padding: 40px 20px; border-bottom: 2px solid #E4E4E7; margin-bottom: 30px;">
      <div style="font-size: 32px; font-weight: 700; color: #2563EB; margin-bottom: 8px;">StudyMaster AI</div>
      <div style="font-size: 22px; font-weight: 600; margin-bottom: 12px;">${result.meta?.title || "Study Package"}</div>
      <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
        <span style="background: ${difficultyBg[result.meta?.difficulty] || "#EFF6FF"}; color: ${difficultyColor[result.meta?.difficulty] || "#1D4ED8"}; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase;">${result.meta?.difficulty || "general"}</span>
        <span style="background: #F5F4F2; color: #71717A; padding: 4px 12px; border-radius: 6px; font-size: 12px;">${result.meta?.subject || ""}</span>
        <span style="background: #F5F4F2; color: #71717A; padding: 4px 12px; border-radius: 6px; font-size: 12px;">Generated ${new Date().toLocaleDateString()}</span>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #18181B;">Summary</h2>
      <p style="line-height: 1.7; color: #3F3F46;">${result.summary || ""}</p>
    </div>

    ${result.keyQuote ? `
    <div style="border-left: 3px solid #2563EB; padding: 12px 16px; background: #EFF6FF; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
      <p style="font-style: italic; color: #1D4ED8;">"${result.keyQuote}"</p>
    </div>` : ""}

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">Learning Objectives</h2>
      ${(result.learningObjectives || []).map((o, i) => `
        <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start;">
          <span style="color: #2563EB; font-weight: 600; min-width: 20px;">${i + 1}.</span>
          <span style="color: #3F3F46;">${o}</span>
        </div>`).join("")}
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">Key Points</h2>
      ${(result.keyPoints || []).map(p => `
        <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start;">
          <span style="color: #2563EB; min-width: 12px;">•</span>
          <span style="color: #3F3F46;">${p}</span>
        </div>`).join("")}
    </div>

    <div style="page-break-before: always; margin-bottom: 30px;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Study Questions</h2>
      ${(result.studyQuestions || []).map((q, i) => `
        <div style="margin-bottom: 12px; padding: 12px 16px; border: 1px solid #E4E4E7; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 600; color: #18181B;">${i + 1}. ${q.question}</span>
            <span style="background: ${difficultyBg[q.difficulty]}; color: ${difficultyColor[q.difficulty]}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${q.difficulty}</span>
          </div>
        </div>`).join("")}
    </div>

    <div style="page-break-before: always; margin-bottom: 30px;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Flashcards</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        ${(result.flashcards || []).map(f => `
          <div style="border: 1px solid #E4E4E7; border-radius: 8px; overflow: hidden;">
            <div style="background: #EFF6FF; padding: 10px 12px; font-weight: 600; font-size: 13px;">${f.front}</div>
            <div style="padding: 10px 12px; color: #3F3F46; font-size: 13px;">${f.back}</div>
          </div>`).join("")}
      </div>
    </div>

    <div style="page-break-before: always;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Quiz</h2>
      ${(result.quiz || []).map((q, i) => `
        <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #E4E4E7; border-radius: 8px;">
          <p style="font-weight: 600; margin-bottom: 10px;">${i + 1}. ${q.question}</p>
          ${(q.options || []).map((opt, idx) => `
            <div style="padding: 6px 10px; margin-bottom: 4px; border-radius: 4px; font-size: 13px; background: ${idx === q.correctAnswer ? "#D1FAE5" : "#F5F4F2"}; color: ${idx === q.correctAnswer ? "#065F46" : "#3F3F46"}; font-weight: ${idx === q.correctAnswer ? 600 : 400};">
              ${String.fromCharCode(65 + idx)}. ${opt} ${idx === q.correctAnswer ? "✓" : ""}
            </div>`).join("")}
          <p style="margin-top: 8px; font-size: 12px; color: #71717A; font-style: italic;">${q.explanation}</p>
        </div>`).join("")}
    </div>
  `;

  document.body.appendChild(el);

  await html2pdf().set({
    margin: 10,
    filename: `StudyMaster-${result.meta?.title || "Study"}.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  }).from(el).save();

  document.body.removeChild(el);
}
