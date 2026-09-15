export default function StatusBadge({ status }) {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-cream-200 text-ink-500 border-cream-300';
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'under_review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'changes_requested':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'verified':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'suspended':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-cream-200 text-ink-500 border-cream-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'under_review':
        return 'Under Review';
      case 'changes_requested':
        return 'Changes Requested';
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'suspended':
        return 'Suspended';
      default:
        return status;
    }
  };

  return (
    <span className={`inline-block px-3 py-1 text-xs uppercase tracking-wide border ${getStatusStyle(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}
