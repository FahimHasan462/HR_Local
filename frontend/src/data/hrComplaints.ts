export type HrComplaint = {
  id: string;
  filedAt: string;
  complainantId: string;
  againstEmployeeId: string;
  subject: string;
  details: string;
};

export type HrComplaintNotification = {
  id: string;
  complaintId: string;
  createdAt: string;
  read: boolean;
};
