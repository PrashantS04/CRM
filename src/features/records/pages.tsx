import { RecordDetailPage } from './RecordDetailPage'
import { RecordListPage } from './RecordListPage'

/** Live, configurable People and Entities screens (fields, sections and rules come from the backend registry). */
export const LivePeoplePage = () => <RecordListPage object="person" />
export const LivePersonPage = () => <RecordDetailPage object="person" />
export const LiveEntitiesPage = () => <RecordListPage object="entity" />
export const LiveEntityPage = () => <RecordDetailPage object="entity" />
