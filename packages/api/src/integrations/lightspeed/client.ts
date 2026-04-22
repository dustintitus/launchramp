type LightspeedClientOptions = {
  baseUrl?: string;
  username: string;
  password: string;
};

export type LightspeedDealer = {
  Cmf: string;
  [k: string]: unknown;
};

export type LightspeedOpenServiceDetRow = Record<string, unknown> & {
  Cmf?: string;
  ROHeaderID?: number;
  rono?: string;
  CustID?: number;
  custid?: number;
  datein?: string;
  promiseddate?: string;
  closedate?: string;
  pudate?: string;
  lastmodifieddate?: string;
  Unit?: Array<Record<string, unknown>>;
};

export type LightspeedCustomerRow = Record<string, unknown> & {
  Cmf?: string;
  CustID?: number;
  custid?: number;
  CustFullName?: string;
  FirstName?: string;
  LastName?: string;
  Companyname?: string;
  EMail?: string;
  CellPhone?: string;
  HomePhone?: string;
  WorkPhone?: string;
  Address1?: string;
  Address2?: string;
  City?: string;
  State?: string;
  Zip?: string;
  Country?: string;
  CustomerType?: string;
  optoutmarketing?: boolean;
};

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function basicAuthHeader(username: string, password: string) {
  const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
  return `Basic ${token}`;
}

export class LightspeedClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(opts: LightspeedClientOptions) {
    this.baseUrl = opts.baseUrl ?? 'https://int.lightspeeddataservices.com/lsapi';
    this.authHeader = basicAuthHeader(opts.username, opts.password);
  }

  private async getJson<T>(path: string) {
    const res = await fetch(joinUrl(this.baseUrl, path), {
      headers: {
        Authorization: this.authHeader,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `Lightspeed GET ${path} failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`
      );
    }
    return (await res.json()) as T;
  }

  async listDealers(): Promise<LightspeedDealer[]> {
    return this.getJson<LightspeedDealer[]>('/Dealer');
  }

  async getOpenServiceDet(cmf: string): Promise<LightspeedOpenServiceDetRow[]> {
    // Lightspeed examples show simple path + optional OData query params. We'll start with full payload.
    return this.getJson<LightspeedOpenServiceDetRow[]>(`/OpenServiceDet/${encodeURIComponent(cmf)}`);
  }

  async getCustomers(cmf: string): Promise<LightspeedCustomerRow[]> {
    return this.getJson<LightspeedCustomerRow[]>(`/Customer/${encodeURIComponent(cmf)}`);
  }
}

