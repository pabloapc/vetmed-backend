const validateDiagnosis = (diagnosis = {}) => {
    const flags = [];
    let score = 100;

    const { startDate, endDate, restDays } = diagnosis;

    if (!startDate || !endDate || typeof restDays !== "number") {
        flags.push("INCOMPLETE_DIAGNOSIS_DATA");
        return { score: 40, flags };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        flags.push("INVALID_DIAGNOSIS_DATES");
        return { score: 40, flags };
    }

    const calculatedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (Math.abs(calculatedDays - restDays) > 1) {
        flags.push("DATE_REST_DAY_MISMATCH");
        score -= 20;
    }

    if (restDays > 30) {
        flags.push("EXTENDED_REST_REQUIRES_REVIEW");
        score -= 10;
    }

    if (start > new Date()) {
        flags.push("FUTURE_START_DATE");
        score -= 30;
    }

    const diffFromNow = (new Date() - start) / (1000 * 60 * 60 * 24);
    if (diffFromNow > 30) {
        flags.push("LATE_SUBMISSION");
        score -= 15;
    }

    return { score: Math.max(score, 0), flags };
};

const validateDocuments = (documents = []) => {
    const flags = [];
    let score = 100;

    if (!Array.isArray(documents) || documents.length === 0) {
        flags.push("NO_DOCUMENTS_UPLOADED");
        return { score: 50, flags };
    }

    const hasRecipe = documents.some((d) => d?.type === "recipe");
    const hasCertificate = documents.some((d) => d?.type === "certificate");

    if (!hasRecipe && !hasCertificate) {
        flags.push("MISSING_REQUIRED_DOCUMENT");
        score -= 30;
    }

    documents.forEach((doc) => {
        if (doc?.fileSize && doc.fileSize < 10000) {
            flags.push(`SUSPICIOUS_FILE_SIZE:${doc.type || "unknown"}`);
            score -= 10;
        }
    });

    return { score: Math.max(score, 0), flags };
};

const runAutoValidation = (auditData = {}) => {
    const diagnosisResult = validateDiagnosis(auditData.diagnosis || {});
    const documentResult = validateDocuments(auditData.documents || []);

    const finalScore = Math.round((diagnosisResult.score + documentResult.score) / 2);
    const allFlags = [...diagnosisResult.flags, ...documentResult.flags];

    let suggestedStatus = "validated";
    if (finalScore < 50) suggestedStatus = "rejected";
    else if (finalScore < 75 || allFlags.length > 0) suggestedStatus = "in_review";

    return {
        score: finalScore,
        flags: allFlags,
        suggestedStatus,
        autoApproved: finalScore >= 85 && allFlags.length === 0,
    };
};

module.exports = { runAutoValidation, validateDiagnosis, validateDocuments };