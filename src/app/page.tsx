import {requireAuth} from "@/lib/auth";
import {getUserOrgs} from "@/lib/org";

export default async function DashboardPage() {
    const user = await requireAuth();

    const orgs = await getUserOrgs(user.id);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Your Organizations</h1>
            {orgs.length === 0 && <p>No organizations yet.</p>}
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {orgs.map((org) => (
                    <li
                        key={org.id}
                        className="p-4 border rounded hover:shadow cursor-pointer"
                        onClick={() => (window.location.href = `/org/${org.id}`)}
                    >
                        <h2 className="font-semibold">{org.name}</h2>
                        <p className="text-sm text-gray-500">Created: {new Date(org.created_at).toLocaleDateString()}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}