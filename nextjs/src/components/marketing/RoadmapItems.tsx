'use client'

import { Octokit } from 'octokit'
import { useEffect, useState } from 'react'

import TemplateCard from './TemplateCard'

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT,
})

const fetchGitHubIssues = async () => {
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/issues', {
      owner: 'commonknowledge',
      repo: 'meep-intelligence-hub',
    })
    return response.data
  } catch (error) {
    console.error('Error fetching GitHub issues:', error)
    throw error
  }
}

const RoadMapItems = () => {
  const [issues, setIssues] = useState<any[]>([]) // Adjust the type according to your issue structure

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchGitHubIssues()
        setIssues(data)
      } catch (error) {
        // Handle error
      }
    }

    fetchData()
  }, [])

  return (
    <div>
      <ul className="grid md:grid-cols-3 grid-cols-1 gap-4">
        {issues.map(
          (
            issue: any // Adjust the type according to your issue structure
          ) => (
            <li key={issue.id}>
              <TemplateCard
                highlighted={true}
                heading={issue.title}
                description={issue.body}
                link={issue.html_url}
                labels={
                  <>
                    <ul>
                      {issue.labels.map(
                        (
                          label: any // Mapping through labels
                        ) => (
                          <li
                            className="inline rounded-full bg-meepGray-600 py-1 px-2 text-tiny "
                            key={label.id}
                          >
                            {label.name}
                          </li>
                        )
                      )}
                    </ul>
                  </>
                }
                isExternalLink={true}
              />
            </li>
          )
        )}
      </ul>
    </div>
  )
}

export default RoadMapItems
