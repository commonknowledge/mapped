"use client";

import { Button } from "@/components/ui/button";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateAutoUpdateFormContext } from "../../NewExternalDataSourceWrapper";
import { gql, useQuery } from "@apollo/client";
import {
  AutoUpdateCreationReviewQuery,
  AutoUpdateCreationReviewQueryVariables,
} from "@/__generated__/graphql";
import { AutoUpdateCard, DATA_SOURCE_FRAGMENT, TriggerUpdateButton } from "@/components/AutoUpdateCard";
import { LoadingIcon } from "@/components/ui/loadingIcon";

const GET_UPDATE_CONFIG = gql`
  query AutoUpdateCreationReview($ID: ID!) {
    externalDataSource(pk: $ID) {
      id
      name
      geographyColumn
      dataType
      connectionDetails {
        crmType: __typename
      }
      autoUpdateEnabled
      updateMapping {
        source
        sourcePath
        destinationColumn
      }
      jobs {
        lastEventAt
        status
      }
      ...DataSourceCard
    }
  }
  ${DATA_SOURCE_FRAGMENT}
`;

export default function Page({
  params: { externalDataSourceId },
}: {
  params: { externalDataSourceId: string };
}) {
  const router = useRouter();
  const context = useContext(CreateAutoUpdateFormContext);

  useEffect(() => {
    context.setStep(4)
  }, [context])

  const pageQuery = useQuery<
    AutoUpdateCreationReviewQuery,
    AutoUpdateCreationReviewQueryVariables
  >(GET_UPDATE_CONFIG, {
    variables: {
      ID: externalDataSourceId,
    },
  });

  if (pageQuery.error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{pageQuery.error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-hLg">Activate data source</h1>
        <p className="mt-6 text-meepGray-300 max-w-sm">
          Your almost there!
        </p>
        <ul className="list-disc list-outside pl-4 space-y-3 mt-3">
          <li className="text-meepGray-300 max-w-sm">Active auto-update webhooks to start updating your data source when the <code className='bg-meepGray-700 rounded-md p-1'>{pageQuery.data?.externalDataSource.geographyColumn}</code> column changes.</li>
          <li className="text-meepGray-300 max-w-sm">Trigger an update to see the data source in action.</li>
        </ul>
      </header>
      {pageQuery.loading || !pageQuery.data ? (
        <LoadingIcon />
      ) : (
        <>
          <div>
            <AutoUpdateCard
              externalDataSource={pageQuery.data.externalDataSource}
            />
          </div>
          <div>
            <TriggerUpdateButton id={externalDataSourceId} className='w-full' variant='reverse' />
          </div>
        </>
      )}
      <Button
        variant={"outline"}
        onClick={() => {
          router.push(`/data-sources`);
        }}
      >
        View all data sources
      </Button>
    </div>
  );
}