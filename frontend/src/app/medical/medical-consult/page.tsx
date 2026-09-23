import MedicalConsultHub from "../../../components/medical/MedicalConsultHub";
import ChatErrorBoundary from "../../../components/shared/ChatErrorBoundary";

export default function MedicalOfficerMedicalConsultPage() {
  return <ChatErrorBoundary><MedicalConsultHub /></ChatErrorBoundary>;
}
