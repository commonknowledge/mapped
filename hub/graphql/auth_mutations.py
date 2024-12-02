import logging
from smtplib import SMTPException
from dataclasses import asdict

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.core.signing import BadSignature, SignatureExpired

from gqlauth.core.constants import Messages, TokenAction
from gqlauth.core.exceptions import TokenScopeError, UserNotVerified
from gqlauth.core.types_ import MutationNormalOutput
from gqlauth.core.utils import (
    get_payload_from_token,
    get_user_by_email,
    revoke_user_refresh_token,
)
from gqlauth.models import UserStatus
from gqlauth.settings import gqlauth_settings as app_settings
from gqlauth.user import arg_mutations as gqlauth_mutations
from gqlauth.user.forms import EmailForm
from gqlauth.user.signals import user_verified

logger = logging.getLogger(__name__)

UserModel = get_user_model()


def user_status_str(status: UserStatus | None) -> str:
    if not status:
        return "None"
    return "verified" if status.verified else "not verified"


class SendPasswordResetEmail(gqlauth_mutations.SendPasswordResetEmail):
    """
    Override library mutation to add copious logging.
    """

    @classmethod
    def resolve_mutation(
        cls,
        info,
        input_: gqlauth_mutations.SendPasswordResetEmailMixin.SendPasswordResetEmailInput,
    ) -> MutationNormalOutput:
        logger.info(f"Password reset email requested, email: {input_.email}")
        try:
            email = input_.email
            f = EmailForm({"email": email})
            if f.is_valid():
                logger.info("Password reset email requested, form valid")
                user = get_user_by_email(email)
                logger.info(f"Sending password reset email to {user}")
                user.status.send_password_reset_email(info, [email])
                logger.info(f"Sent password reset email to {user}")
                return MutationNormalOutput(success=True)
            errors = f.errors.get_json_data()
            logger.error(f"Password reset email request failed, form invalid: {errors}")
            return MutationNormalOutput(success=False, errors=errors)
        except ObjectDoesNotExist:
            logger.error(
                f"Password reset email request failed: user {input_.email} does not exist"
            )
            return MutationNormalOutput(success=True)  # even if user is not registered
        except SMTPException as e:
            logger.error(f"Password reset email request failed: SMTPException {e}")
            return MutationNormalOutput(success=False, errors=Messages.EMAIL_FAIL)
        except UserNotVerified:
            logger.error(
                f"Password reset email request failed: user {input_.email} not verified"
            )
            user = get_user_by_email(input_.email)
            try:
                logger.info(f"Sending activation email to {user}")
                user.status.resend_activation_email(info)
                logger.info(f"Sent activation email to {user}")
                return MutationNormalOutput(
                    success=False,
                    errors={"email": Messages.NOT_VERIFIED_PASSWORD_RESET},
                )
            except SMTPException as e:
                logger.error(f"Resend activation email failed: SMTPException {e}")
                return MutationNormalOutput(success=False, errors=Messages.EMAIL_FAIL)


class PasswordReset(gqlauth_mutations.PasswordReset):
    """
    Override library mutation to add copious logging.
    """

    @classmethod
    def resolve_mutation(
        cls, _, input_: gqlauth_mutations.PasswordReset.PasswordResetInput
    ) -> MutationNormalOutput:
        logger.info(f"Password reset requested, token: {input_.token}")
        try:
            payload = get_payload_from_token(
                input_.token,
                TokenAction.PASSWORD_RESET,
                app_settings.EXPIRATION_PASSWORD_RESET_TOKEN,
            )
            logger.info(f"Password reset requested, payload: {payload}")
            user = UserModel._default_manager.get(**payload)
            logger.info(f"Password reset requested, user: {user}")
            status: "UserStatus" = getattr(user, "status")  # noqa: B009
            logger.info(f"Password reset requested, user status: {user_status_str(status)}")
            f = cls.form(user, asdict(input_))  # type: ignore
            if f.is_valid():
                logger.info("Password reset requested, form is valid")
                revoke_user_refresh_token(user)
                logger.info(f"Revoked refresh tokens for user: {user}")
                user = f.save()  # type: ignore
                logger.info(f"Saved new password for user: {user}")
                if status.verified is False:
                    status.verified = True
                    status.save(update_fields=["verified"])
                    logger.info(f"Marked {user} as verified")
                    user_verified.send(sender=cls, user=user)

                logger.info(f"Password reset successful for user {user}")
                return MutationNormalOutput(success=True)
            errors = f.errors.get_json_data()
            logger.error(f"Password reset failed, form invalid: {errors}")
            return MutationNormalOutput(success=False, errors=errors)
        except SignatureExpired:
            return MutationNormalOutput(success=False, errors=Messages.EXPIRED_TOKEN)
        except (BadSignature, TokenScopeError):
            return MutationNormalOutput(success=False, errors=Messages.INVALID_TOKEN)
