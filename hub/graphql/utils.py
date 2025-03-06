from typing import cast

import strawberry
import strawberry_django
from strawberry.types.info import Info

from utils.py import transform_dict_values_recursive


def attr_resolver(root, info: Info):
    return getattr(root, info.python_name, None)


def attr_field(**kwargs):
    return strawberry_django.field(resolver=attr_resolver, **kwargs)


def fn_resolver(root, info: Info):
    return getattr(root, info.python_name, lambda: None)()


def fn_field(**kwargs):
    return strawberry_django.field(resolver=fn_resolver, **kwargs)


def dict_resolver(default=None):
    def _resolver(root, info: Info):
        return root.get(info.python_name, default)

    return _resolver


def dict_key_field(default=None, **kwargs):
    return strawberry_django.field(resolver=dict_resolver(default), **kwargs)


def graphql_type_to_dict(value, delete_null_keys=False):
    if not isinstance(value, dict):
        value = strawberry.asdict(value)
    return transform_dict_values_recursive(
        value,
        lambda x: x if (x is not strawberry.UNSET) else None,
        delete_null_keys=delete_null_keys,
    )


async def django_model_instance_to_strawberry_type(
    instance, graphql_type: strawberry.type
):
    return cast(graphql_type, instance)
