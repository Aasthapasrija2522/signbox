
import StatusBadge from './StatusBadge';
import { Link } from 'react-router-dom';

function DocumentCard({ id, title, status, uploadedAt }) {

  console.log('DocumentCard ID:', id);

  return (
    <Link
      to={`/documents/${id}`}
      className="block border rounded-lg p-4 shadow-sm flex justify-between items-center hover:shadow-md transition"
    >
      <div>
        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="text-sm text-gray-500">
          Uploaded {uploadedAt}
        </p>
      </div>

      <StatusBadge status={status} />
    </Link>
  );
}

export default DocumentCard;

