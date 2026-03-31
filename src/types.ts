export interface AmoCRMLead {
  id: number;
  name: string;
  price: number;
  responsible_user_id: number;
  group_id: number;
  status_id: number;
  pipeline_id: number;
  created_at: number;
  updated_at: number;
  closed_at: number | null;
  closest_task_at: number | null;
  _embedded?: Record<string, unknown>;
}

export interface AmoCRMContact {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  responsible_user_id: number;
  created_at: number;
  updated_at: number;
  custom_fields_values: unknown[] | null;
  _embedded?: Record<string, unknown>;
}

export interface AmoCRMPipeline {
  id: number;
  name: string;
  sort: number;
  is_main: boolean;
  is_unsorted_on: boolean;
  is_archive: boolean;
  _embedded?: {
    statuses: AmoCRMStatus[];
  };
}

export interface AmoCRMStatus {
  id: number;
  name: string;
  sort: number;
  is_editable: boolean;
  pipeline_id: number;
  color: string;
  type: number;
}

export interface AmoCRMListResponse<T> {
  _page: number;
  _links: Record<string, unknown>;
  _embedded: Record<string, T[]>;
}

export interface AmoCRMError {
  title: string;
  type: string;
  status: number;
  detail: string;
}
