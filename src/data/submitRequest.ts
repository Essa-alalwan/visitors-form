import { generateReferenceNumber } from "../utils/referenceNumber";
import type { AttachmentPayload, SubmissionPayload, SubmitResult } from "./payloadTypes";

/**
 * Open question for backend integration: Apps Script Web Apps have constraints
 * around multipart/form-data parsing and payload size limits for base64 JSON.
 * The real implementation will likely need to either (a) convert File objects
 * to base64 strings before sending as JSON, or (b) POST as FormData if the
 * Apps Script endpoint is configured to accept it. This stub deliberately
 * keeps File objects as-is on the payload so that conversion logic can be
 * added inside this function later without changing any calling code.
 */

function describeAttachment(attachment: AttachmentPayload) {
  return {
    ...attachment,
    file: {
      name: attachment.file.name,
      size: attachment.file.size,
      type: attachment.file.type,
    },
  };
}

function describePayloadForLogging(payload: SubmissionPayload) {
  const described: Record<string, unknown> = { ...payload };

  if (payload.requestType === "visitors") {
    described.visitors = payload.visitors.map((v) => ({
      ...v,
      attachments: v.attachments.map(describeAttachment),
    }));
  } else if (payload.requestType === "material") {
    described.material = {
      details: payload.material.details,
      items: payload.material.items.map((m) => ({
        ...m,
        attachments: m.attachments.map(describeAttachment),
      })),
    };
  } else if (payload.requestType === "equipment") {
    described.equipment = payload.equipment.map((e) => ({
      ...e,
      attachments: e.attachments.map(describeAttachment),
    }));
  }

  return described;
}

function randomDelay(minMs: number, maxMs: number) {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function submitRequest(
  payload: SubmissionPayload,
): Promise<SubmitResult> {
  // eslint-disable-next-line no-console
  console.log(
    "[submitRequest] Submitting Aldur II access request:",
    describePayloadForLogging(payload),
  );

  await randomDelay(900, 1500);

  const submittedAt = new Date().toISOString();
  const referenceNumber = generateReferenceNumber(new Date(submittedAt));

  return { success: true, referenceNumber, submittedAt };
}
