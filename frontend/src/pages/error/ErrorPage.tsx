import { ExclamationTriangleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import type { JSX } from 'react'

import styles from './ErrorPage.module.scss'

import { Button, Icon } from '@/shared/ui/actions/index.js'
import { EmptyState } from '@/shared/ui/feedback/index.js'

interface ErrorPageProps {
  variant: 'error' | 'not-found'
  onRetry?: () => void
}

export function ErrorPage ({ variant, onRetry }: ErrorPageProps): JSX.Element {
  return (
    <div className={styles.page}>
      {variant === 'error'
        ? (
          <EmptyState
            icon={<Icon icon={ExclamationTriangleIcon} size='lg' />}
            title='Что-то пошло не так'
            description='Произошла непредвиденная ошибка. Попробуйте ещё раз.'
            action={onRetry === undefined ? undefined : <Button onClick={onRetry}>Повторить</Button>}
          />
        )
        : (
          <EmptyState
            icon={<Icon icon={QuestionMarkCircleIcon} size='lg' />}
            title='Страница не найдена'
            description='По этому адресу ничего нет. Проверьте ссылку или вернитесь на главную.'
            action={<Button to='/'>На главную</Button>}
          />
        )}
    </div>
  )
}