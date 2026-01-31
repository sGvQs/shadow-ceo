import { cache } from "react";
import { getAuthenticatedUser } from "../auth/utils";

export const getCurrentUser = cache(async () => {
    return await getAuthenticatedUser();
});