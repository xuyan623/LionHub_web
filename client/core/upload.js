import { UPLOAD_MAX_SIZE_BYTES, MAX_UPLOAD_COUNT } from "./state.js";
import { requestJson } from "./http.js";

export function getSelectedUploadFiles(values) {
  return values.filter((value) => value instanceof File && value.size > 0);
}

export async function uploadLocalAttachments(taskId, files, source = "submission") {
  const oversize = files.filter((file) => file.size > UPLOAD_MAX_SIZE_BYTES);
  if (oversize.length) {
    const names = oversize.map((file) => file.name).join("、");
    throw new Error(`附件 ${names} 超过单文件 5MB 限制，请压缩后重新上传。`);
  }
  if (files.length > MAX_UPLOAD_COUNT) {
    throw new Error(`单次附件提交最多 ${MAX_UPLOAD_COUNT} 个文件，当前选择了 ${files.length} 个。`);
  }

  const formData = new FormData();
  formData.append("taskId", taskId);
  formData.append("source", source);
  for (const file of files) {
    formData.append("files", file);
  }

  const payload = await requestJson("/api/uploads", {
    method: "POST",
    body: formData,
  });
  const attachments = payload?.attachments || [];
  const { getCurrentMember } = await import("../domain/query.js");
  const member = getCurrentMember();
  if (member) {
    for (const attachment of attachments) {
      attachment.uploadedBy = member.id;
      attachment.uploadedByName = member.name;
    }
  }
  return attachments;
}

export function getLocalAttachmentPaths(attachments) {
  return attachments
    .filter((attachment) => attachment?.storage === "local" && attachment?.storagePath)
    .map((attachment) => attachment.storagePath);
}

export async function deleteLocalAttachments(attachments) {
  const paths = getLocalAttachmentPaths(attachments);
  if (!paths.length) {
    return;
  }
  try {
    await requestJson("/api/uploads/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paths }),
    });
  } catch (error) {
    console.error("Failed to delete local attachments:", error);
  }
}
