import DocumentCard from '../components/DocumentCard';

const fakeDocuments = [
  { id: 1, title: 'Freelance Contract.pdf', status: 'Draft', uploadedAt: '2 days ago' },
  { id: 2, title: 'NDA Agreement.pdf', status: 'Pending', uploadedAt: '5 days ago' },
  { id: 3, title: 'Lease Agreement.pdf', status: 'Signed', uploadedAt: '1 week ago' },
];

function Dashboard() {
  return (
    <div className="max-w-2xl mx-auto mt-10 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">My Documents</h1>
      {fakeDocuments.map((doc) => (
        <DocumentCard
          key={doc.id}
          title={doc.title}
          status={doc.status}
          uploadedAt={doc.uploadedAt}
        />
      ))}
    </div>
  );
}

export default Dashboard;