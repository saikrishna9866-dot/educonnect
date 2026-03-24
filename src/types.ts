export type Role = 'student' | 'faculty';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  content: string;
  timestamp: number;
}

export interface Doubt {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  question: string;
  status: 'pending' | 'answered';
  answer?: string;
  facultyId?: string;
  facultyName?: string;
  timestamp: number;
  messages: Message[];
}
