export interface AttachmentPayload {
  id: string;
  file?: File;
  // Set when this attachment references a file already on the server from
  // a past submission (loaded via "My Requests" for editing) instead of a
  // freshly chosen browser file — mutually exclusive with `file`.
  existingPath?: string;
  description: string;
  remarks?: string;
  // Visitors/Equipment only — the backend ignores this for Materials.
  expiryDate?: string;
}

export interface VisitorPayload {
  id: string;
  name: string;
  cprOrPassport: string;
  jobTitle: string;
  cprExpiryDate: string;
  attachments: AttachmentPayload[];
}

export interface MaterialDetailsPayload {
  createdBy: string;
  substanceDestination: string;
  driverReceiverId: string;
  companyAddress: string;
  vehiclePlateNo: string;
}

export interface MaterialItemPayload {
  id: string;
  inOut: string;
  returnable: string;
  description: string;
  quantity: string;
  uom: string;
  pat: string;
  remarks?: string;
  attachments: AttachmentPayload[];
}

export interface EquipmentItemPayload {
  id: string;
  typeModel: string;
  plateNo: string;
  name: string;
  operatorLicenseNo: string;
  remarks?: string;
  attachments: AttachmentPayload[];
}

export interface EquipmentDetailsPayload {
  createdBy: string;
  cprExpiryDate: string;
}

export interface BaseSubmissionPayload {
  visitDateTime: string;
  visitDuration?: string;
  companyName: string;
  contactEmail?: string;
  aldurContactPerson: string;
  department: string;
  visitPurpose: string;
  requestRemarks?: string;
  existingRequestId?: string;
  bringPPE?: boolean;
}

export type SubmissionPayload = BaseSubmissionPayload &
  (
    | {
        requestType: "visitors";
        visitKind: string;
        visitors: VisitorPayload[];
      }
    | {
        requestType: "material";
        material: {
          details: MaterialDetailsPayload;
          items: MaterialItemPayload[];
        };
      }
    | {
        requestType: "equipment";
        equipmentDetails: EquipmentDetailsPayload;
        equipment: EquipmentItemPayload[];
      }
  );

/**
 * Normalized, UI-facing result shape. The real backend's raw responses are
 * asymmetric — success looks like {ok:true, requestId, version} and failure
 * looks like {success:false, error} (confirmed empirically against the live
 * endpoint) — that translation happens in submitRequest.ts so the rest of
 * the app only ever deals with this consistent shape.
 */
export type SubmitResult =
  | { success: true; requestId: string; version?: string }
  | { success: false; error: string };
