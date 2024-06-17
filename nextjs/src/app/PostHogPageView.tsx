'use client'

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { usePostHog } from 'posthog-js/react';
import { gql, useQuery } from "@apollo/client";
import { useAtomValue } from "jotai";
import { currentOrganisationIdAtom } from "@/data/organisation";
import { MyOrgsQuery, UserDataQuery } from "@/__generated__/graphql";

export default function PostHogPageView() : null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  // Track pageviews
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture(
        '$pageview',
        {
          '$current_url': url,
        }
      )
    }
  }, [pathname, searchParams, posthog])

  const userData = useQuery<UserDataQuery>(USER_QUERY)

  useEffect(() => {
    if (userData.data) {
      console.log('identify', userData.data.me.id)
      posthog.identify(userData.data.me.id, {
        email: userData.data.me.email,
        username: userData.data.me.username,
        firstName: userData.data.publicUser?.firstName,
        lastName: userData.data.publicUser?.lastName,
        name: `${userData.data.publicUser?.firstName} ${userData.data.publicUser?.lastName}`,
      })
    }
  }, [userData.data, posthog])

  const currentOrgId = useAtomValue(currentOrganisationIdAtom)

  const myOrgs = useQuery<MyOrgsQuery>(MY_ORGS)

  useEffect(() => {
    if (myOrgs.data && currentOrgId) {
      const org = myOrgs.data.myOrganisations.find((org) => org.id === currentOrgId)
      if (org) {
        console.log('grouping', org.id)
        posthog.group("organisation", org.id, {
          name: org.name,
          slug: org.slug,
        })
      }
    }
  }, [myOrgs.data, currentOrgId, posthog])
  
  return null
}

const MY_ORGS = gql`
  query MyOrgs {
    myOrganisations {
      id
      name
      slug
    }
  }
`

const USER_QUERY = gql`
  query UserData {
    me {
      id
      email
      username
    }
    publicUser {
      firstName
      lastName
    }
  }
`