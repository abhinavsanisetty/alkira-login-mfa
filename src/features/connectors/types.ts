/** The connector domain, owned by the feature rather than by the mock.
 *
 *  Kept here so nothing in the application imports a type from src/mocks/:
 *  deleting the mock has to be a one-line change, and it is not if production
 *  code depends on the folder for its shapes. Seed data still lives in the
 *  mock; only the shape lives here. */

export type ConnectorType = "AWS" | "Azure" | "GCP";
export type ConnectorStatus = "connected" | "degraded" | "provisioning";

export interface Connector {
  id: string;
  name: string;
  type: ConnectorType;
  region: string;
  status: ConnectorStatus;
  /** Display names only. A real API would return ids the client resolves
   *  separately; there is no directory to resolve against here. */
  owners: readonly string[];
}
