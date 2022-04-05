import axios, { AxiosInstance } from 'axios';

export default class ClickupClient {
	private httpClient: AxiosInstance;
	constructor(private readonly apiToken: string) {
		this.httpClient = axios.create({
			baseURL: 'https://api.clickup.com/api/v2'
		});

		this.httpClient.defaults.headers.common['Authorization'] = apiToken;
	}

	public async getTimeEntriesWithinDateRange(teamId: string, params: object): Promise<{data: any[]}> {
		return this.httpClient.request<{data: any[]}>({
			method: 'get',
			url: `/team/${teamId}/time_entries`,
			params: params,
			validateStatus: (status: number) => status === 200,
		}).then(result => {
			return result.data;
		});
	}
}
