export interface Participant {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  institution: string;
  isConfirmed: boolean;
  selectedTime: Date;
  createdAt: Date;
}
