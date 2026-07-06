/*
 * Author: Jamius Siam
 * Since: 07/07/2026
 */
import type { JSX } from "react";
import { Helmet } from "react-helmet-async";

const SITE_NAME = "Codedrift";

type PageTitleProps = { title: string };

const PageTitle = ({ title }: PageTitleProps): JSX.Element => (
  <Helmet>
    <title>{`${title} · ${SITE_NAME}`}</title>
  </Helmet>
);

export default PageTitle;
