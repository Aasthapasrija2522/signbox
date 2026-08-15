import { useState } from 'react';
function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Name:', name);
    };
    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 max-w-sm mx-auto mt-20 p-6 border rounded-lg"
        >
            <h1 className="text-2xl font-bold">Sign In</h1>

            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="border p-2 rounded"
            />

            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="border p-2 rounded"
            />
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="border p-2 rounded"
            />

            <button
                type="submit"
                className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
                Sign In
            </button>
        </form>
    );
}

export default SignupPage;