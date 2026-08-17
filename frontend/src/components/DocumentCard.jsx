import StatusBadge from './StatusBadge';

function DocumentCard({ title, status, uploadedAt }) {
  return (
    <div className="border rounded-lg p-4 shadow-sm flex justify-between items-center">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">Uploaded {uploadedAt}</p>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

export default DocumentCard;