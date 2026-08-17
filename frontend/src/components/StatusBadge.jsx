function StatusBadge({ status }) {
  const statusStyles = {
    Draft: 'bg-gray-200 text-gray-700',
    Pending: 'bg-yellow-200 text-yellow-800',
    Viewed: 'bg-blue-200 text-blue-800',
    Signed: 'bg-green-200 text-green-800',
  };

  return (
    <span className={`px-2 py-1 rounded text-sm font-medium ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

export default StatusBadge;