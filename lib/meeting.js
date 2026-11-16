import { SITE } from "./site";

const subject = "Meeting request - BytecGlobal";
const body = [
  "Hi BytecGlobal Team,",
  "",
  "I'd like to book a meeting to discuss my project and learn how you can help.",
  "",
  "Name: ",
  "Company: ",
  "Project / services needed: ",
  "Preferred meeting date and time: ",
  "Time zone: ",
  "",
  "Please let me know your availability.",
  "",
  "Thank you!",
].join("\r\n");

export const MEETING_EMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SITE.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
