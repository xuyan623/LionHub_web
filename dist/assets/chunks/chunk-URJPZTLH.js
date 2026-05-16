import {
  requestJson
} from "./chunk-AFQ47FFH.js";
import {
  MAX_UPLOAD_COUNT,
  UPLOAD_MAX_SIZE_BYTES
} from "./chunk-NDL62ULM.js";

// client/core/upload.js
function getSelectedUploadFiles(values) {
  return values.filter((value) => value instanceof File && value.size > 0);
}
async function uploadLocalAttachments(taskId, files, source = "submission") {
  const oversize = files.filter((file) => file.size > UPLOAD_MAX_SIZE_BYTES);
  if (oversize.length) {
    const names = oversize.map((file) => file.name).join("\u3001");
    throw new Error(`\u9644\u4EF6 ${names} \u8D85\u8FC7\u5355\u6587\u4EF6 5MB \u9650\u5236\uFF0C\u8BF7\u538B\u7F29\u540E\u91CD\u65B0\u4E0A\u4F20\u3002`);
  }
  if (files.length > MAX_UPLOAD_COUNT) {
    throw new Error(`\u5355\u6B21\u9644\u4EF6\u63D0\u4EA4\u6700\u591A ${MAX_UPLOAD_COUNT} \u4E2A\u6587\u4EF6\uFF0C\u5F53\u524D\u9009\u62E9\u4E86 ${files.length} \u4E2A\u3002`);
  }
  const formData = new FormData();
  formData.append("taskId", taskId);
  formData.append("source", source);
  for (const file of files) {
    formData.append("files", file);
  }
  const payload = await requestJson("/api/uploads", {
    method: "POST",
    body: formData
  });
  const attachments = payload?.attachments || [];
  const { getCurrentMember } = await import("./query-KC33TORI.js");
  const member = getCurrentMember();
  if (member) {
    for (const attachment of attachments) {
      attachment.uploadedBy = member.id;
      attachment.uploadedByName = member.name;
    }
  }
  return attachments;
}
function getLocalAttachmentPaths(attachments) {
  return attachments.filter((attachment) => attachment?.storage === "local" && attachment?.storagePath).map((attachment) => attachment.storagePath);
}
async function deleteLocalAttachments(attachments) {
  const paths = getLocalAttachmentPaths(attachments);
  if (!paths.length) {
    return;
  }
  try {
    await requestJson("/api/uploads/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ paths })
    });
  } catch (error) {
    console.error("Failed to delete local attachments:", error);
  }
}

export {
  getSelectedUploadFiles,
  uploadLocalAttachments,
  getLocalAttachmentPaths,
  deleteLocalAttachments
};
