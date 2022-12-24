import React, { Fragment, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactEditor, useSlate } from 'slate-react';
import { Transforms, Range } from 'slate';
import { useModal } from '@faceless-ui/modal';
import ElementButton from '../../Button';
import LinkIcon from '../../../../../../icons/Link';
import reduceFieldsToValues from '../../../../../Form/reduceFieldsToValues';
import { useConfig } from '../../../../../../utilities/Config';
import isElementActive from '../../isActive';
import { unwrapLink } from '../utilities';
import { useEditDepth } from '../../../../../../utilities/EditDepth';
import { formatDrawerSlug } from '../../../../../../elements/Drawer';
import { getBaseFields } from '../LinkDrawer/baseFields';
import { LinkDrawer } from '../LinkDrawer';
import { Field } from '../../../../../../../../fields/config/types';
import { Props as RichTextFieldProps } from '../../../types';

const insertLink = (editor, fields) => {
  const isCollapsed = editor.selection && Range.isCollapsed(editor.selection);
  const data = reduceFieldsToValues(fields, true);

  const newLink = {
    type: 'link',
    linkType: data.linkType,
    url: data.url,
    doc: data.doc,
    newTab: data.newTab,
    fields: data.fields,
    children: [],
  };

  if (isCollapsed || !editor.selection) {
    // If selection anchor and focus are the same,
    // Just inject a new node with children already set
    Transforms.insertNodes(editor, {
      ...newLink,
      children: [{ text: String(data.text) }],
    });
  } else if (editor.selection) {
    // Otherwise we need to wrap the selected node in a link,
    // Delete its old text,
    // Move the selection one position forward into the link,
    // And insert the text back into the new link
    Transforms.wrapNodes(editor, newLink, { split: true });
    Transforms.delete(editor, { at: editor.selection.focus.path, unit: 'word' });
    Transforms.move(editor, { distance: 1, unit: 'offset' });
    Transforms.insertText(editor, String(data.text), { at: editor.selection.focus.path });
  }

  ReactEditor.focus(editor);
};

export const LinkButton: React.FC<{
  path: string
  fieldProps: RichTextFieldProps
}> = ({ fieldProps }) => {
  const customFieldSchema = fieldProps?.admin?.link?.fields;

  const { t } = useTranslation(['upload', 'general']);
  const editor = useSlate();
  const config = useConfig();

  const [fieldSchema] = useState(() => {
    const fields: Field[] = [
      ...getBaseFields(config),
    ];

    if (customFieldSchema) {
      fields.push({
        name: 'fields',
        type: 'group',
        admin: {
          style: {
            margin: 0,
            padding: 0,
            borderTop: 0,
            borderBottom: 0,
          },
        },
        fields: customFieldSchema,
      });
    }

    return fields;
  });

  const { openModal, closeModal } = useModal();
  const uuid = useId();
  const editDepth = useEditDepth();
  const drawerSlug = formatDrawerSlug({
    slug: `rich-text-link-${uuid}`,
    depth: editDepth,
  });

  return (
    <Fragment>
      <ElementButton
        format="link"
        tooltip={t('fields:addLink')}
        className="link"
        onClick={() => {
          if (isElementActive(editor, 'link')) {
            unwrapLink(editor);
          } else {
            openModal(drawerSlug);
          }
        }}
      >
        <LinkIcon />
      </ElementButton>
      <LinkDrawer
        drawerSlug={drawerSlug}
        handleModalSubmit={(fields) => {
          insertLink(editor, fields);
          closeModal(drawerSlug);
        }}
        fieldSchema={fieldSchema}
        handleClose={() => {
          closeModal(drawerSlug);
        }}
      />
    </Fragment>
  );
};