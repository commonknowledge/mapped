from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from hub.models import (
    Area,
    AreaData,
    DataSet,
    DataType,
    Membership,
    Organisation,
    Person,
    PersonData,
    Report,
    User,
    UserProperties,
)


class MembershipInline(admin.TabularInline):
    model = Membership


class OrganisationInline(admin.TabularInline):
    model = Organisation


@admin.register(UserProperties)
class UserPropertiesAdmin(admin.ModelAdmin):
    search_fields = ["user__username", "full_name", "organisation_name"]
    list_filter = [
        "user__is_active",
        "email_confirmed",
        "account_confirmed",
        "last_seen",
    ]
    list_display = [
        "user",
        "full_name",
        "organisation_name",
        "email_confirmed",
        "account_confirmed",
        "user_is_active",
        "last_seen",
    ]

    @admin.display(description="Is Active")
    def user_is_active(self, obj):
        return obj.user.is_active


class HubUserAdmin(UserAdmin):
    model = User

    list_display = [
        "username",
        "get_full_name",
        "organisation",
        "email",
        "last_seen",
        "is_superuser",
    ]

    search_fields = [
        "username",
        "first_name",
        "last_name",
        "memberships__organisation__name",
    ]

    list_filter = [
        "memberships__organisation",
        "is_superuser",
    ]

    ordering = ["username"]

    @admin.display(ordering="memberships__organisation__name")
    def organisation(self, obj):
        return " / ".join(
            sorted(
                list(obj.memberships.all().values_list("organisation__name", flat=True))
            )
        )

    @admin.display(ordering="properties__last_seen")
    def last_seen(self, obj):
        return obj.properties.last_seen

    inlines = [
        MembershipInline,
    ]


admin.site.unregister(User)
admin.site.register(User, HubUserAdmin)


class DataSetDataTypeInline(admin.StackedInline):
    model = DataType
    extra = 0


@admin.register(DataSet)
class DataSetAdmin(admin.ModelAdmin):
    list_display = (
        "label",
        "description",
        "source_label",
        "category",
        "order",
        "featured",
        "is_public",
        "visible",
    )
    list_editable = ("order", "featured", "is_public", "visible")
    list_filter = (
        "category",
        "featured",
        "areas_available",
        "is_public",
        "visible",
        "data_type",
    )
    ordering = ("category", "order", "label")
    search_fields = ["name", "label", "description", "source", "source_label"]

    inlines = [
        DataSetDataTypeInline,
    ]

    def has_module_permission(self, request):
        if request.user.is_superuser or request.user.has_perm("hub.order_and_feature"):
            return True

        return False

    def has_change_permission(self, request, obj=None):
        has_perm = super().has_change_permission(request, obj)

        if (
            not has_perm
            and request.user.is_superuser
            or request.user.has_perm("hub.order_and_feature")
        ):
            return True

        return has_perm

    def get_readonly_fields(self, request, obj):
        fields = ()

        if not request.user.has_perm("hub.dataset_change") and request.user.has_perm(
            "hub.order_and_feature"
        ):
            fields = (
                "label",
                "data_type",
                "is_range",
                "description",
                "category",
                "name",
                "source",
                "source_label",
                "data_url",
                "source_type",
                "is_upload",
            )

        return fields


@admin.register(AreaData)
class AreaDataAdmin(admin.ModelAdmin):
    list_display = (
        "value",
        "data_type",
        "area",
    )
    list_filter = (
        "data_type__area_type",
        "data_type",
        "area",
    )
    search_fields = (
        "id",
        "data_type__name",
        "data_type__data_set__name",
        "area__name",
    )


@admin.register(PersonData)
class PersonDataAdmin(admin.ModelAdmin):
    list_display = (
        "value",
        "data_type",
        "person",
    )
    list_filter = (
        "data_type",
        "person",
    )
    search_fields = (
        "id",
        "data_type__name",
        "data_type__data_set__name",
        "person__name",
    )


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = (
        "__str__",
        "area_type",
        "gss",
        "mapit_id",
    )
    list_filter = ("area_type",)
    search_fields = (
        "name",
        "gss",
        "mapit_id",
    )


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = (
        "__str__",
        "person_type",
    )
    search_fields = (
        "name",
        "areas__name",
    )
    list_filter = ("person_type",)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    pass


@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)

    inline = [
        MembershipInline,
    ]


# Membership
@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = (
        "organisation",
        "user",
        "role",
    )
    search_fields = (
        "organisation__name",
        "user__name",
        "role",
    )

    inline = [
        OrganisationInline,
    ]
