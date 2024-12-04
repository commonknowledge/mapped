'use client'

import { usePostHog } from 'posthog-js/react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const Feedback = () => {
  const posthog = usePostHog()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [textAreaValue, setTextAreaValue] = useState('')
  const [validationMessage, setValidationMessage] = useState('')

  interface Survey {
    id: string
    name: string
    type: string
  }

  useEffect(() => {
    posthog.getActiveMatchingSurveys((surveys) => {
      const firstSurvey = surveys.find((survey) => survey.type === 'api')
      if (firstSurvey) {
        setSurvey(firstSurvey)
        posthog.capture('survey shown', {
          $survey_id: firstSurvey.id,
          $survey_name: firstSurvey.name,
        })
      }
    })
  }, [])

  const handleTextAreaChange = (event: { target: { value: string } }) => {
    setTextAreaValue(event.target.value)
    if (validationMessage) setValidationMessage('')
  }

  const submitFeedback = () => {
    if (survey && textAreaValue.trim()) {
      posthog.capture('survey sent', {
        $survey_id: survey.id,
        $survey_name: survey.name,
        $survey_response: textAreaValue,
      })
      setTextAreaValue('')
      setFeedbackSubmitted(true)
    } else {
      setValidationMessage("This field can't be blank.")
    }
  }

  return (
    <div className="max-w-prose mx-auto">
      <h1 className="text-hLg font-IBMPlexSans mb-4">
        Submit feedback on Mapped
      </h1>
      {!feedbackSubmitted ? (
        <>
          <Textarea
            value={textAreaValue}
            onChange={handleTextAreaChange}
            className="mb-2 bg-white text-black"
          ></Textarea>
          {validationMessage && (
            <div className="mb-2 text-white">{validationMessage}</div>
          )}
          <Button onClick={submitFeedback} variant="reverse" size="sm">
            Send feedback
          </Button>
        </>
      ) : (
        <p>Thanks for submitting your feedback!</p>
      )}
    </div>
  )
}

export default Feedback
