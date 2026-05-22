export type HrComplaint = {
  id: string;
  filedAt: string;
  complainantId: string;
  againstEmployeeId: string;
  subject: string;
  details: string;
};

export type BonusStatus = "pending" | "provided";

export type HrNotification = {
  id: string;
  type: "complaint" | "bonus" | "registration";
  complaintId?: string;
  employeeId?: string;
  subject?: string;
  message?: string;
  bonusYear?: number;
  bonusStatus?: BonusStatus;
  createdAt: string;
  read: boolean;
};

/** @deprecated Use HrNotification */
export type HrComplaintNotification = HrNotification;
