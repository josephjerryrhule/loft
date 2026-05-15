import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAmbassadorHierarchy, getHierarchyData } from "@/app/actions/operations";
import AmbassadorManagementClient from "./AmbassadorManagementClient";

export default async function AmbassadorManagementPage() {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (!session?.user || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        redirect("/parent");
    }

    // Fetch initial data on the server
    const [ambassadors, hierarchyData] = await Promise.all([
        getAmbassadorHierarchy(),
        getHierarchyData()
    ]);

    return (
        <AmbassadorManagementClient 
            initialAmbassadors={ambassadors as any} 
            initialHierarchyData={hierarchyData} 
        />
    );
}
